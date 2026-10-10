package pl.adriantur.stanowisko

import androidx.room.ColumnInfo
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.flow.Flow

@Entity
data class PolicyRecord(
    @PrimaryKey val id: Int = 1,
    val revision: Long = 0,
    val rules: String = "[]",
    val appliedRevision: Long = -1,
    val appliedRules: String = "[]",
    val enabled: Boolean = false,
    val error: String = "",
    @ColumnInfo(defaultValue = "0") val keepScreenOn: Boolean = false,
    @ColumnInfo(defaultValue = "0") val appliedKeepScreenOn: Boolean = false,
    @ColumnInfo(defaultValue = "0") val hideSystemBars: Boolean = true,
    @ColumnInfo(defaultValue = "0") val appliedHideSystemBars: Boolean = false,
)

@Entity
data class AuditEvent(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val time: Long = System.currentTimeMillis(),
    val kind: String,
    val detail: String,
)

@Dao
interface WorkspaceDao {
    @Query("SELECT * FROM PolicyRecord WHERE id=1") fun observe(): Flow<PolicyRecord?>

    @Query("SELECT * FROM PolicyRecord WHERE id=1") suspend fun policy(): PolicyRecord?

    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun put(value: PolicyRecord)

    @Insert suspend fun log(event: AuditEvent)

    @Query("SELECT * FROM AuditEvent ORDER BY id DESC LIMIT 80")
    fun events(): Flow<List<AuditEvent>>

    @Query(
        "DELETE FROM AuditEvent WHERE id NOT IN (SELECT id FROM AuditEvent ORDER BY id DESC LIMIT 1000)"
    )
    suspend fun trim()
}

@Database(entities = [PolicyRecord::class, AuditEvent::class], version = 3, exportSchema = true)
abstract class WorkspaceDatabase : RoomDatabase() {
    abstract fun dao(): WorkspaceDao
}

val MIGRATION_1_2 =
    object : Migration(1, 2) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL(
                "ALTER TABLE PolicyRecord ADD COLUMN keepScreenOn INTEGER NOT NULL DEFAULT 0"
            )
            db.execSQL(
                "ALTER TABLE PolicyRecord ADD COLUMN appliedKeepScreenOn INTEGER NOT NULL DEFAULT 0"
            )
        }
    }
val MIGRATION_2_3 =
    object : Migration(2, 3) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL(
                "ALTER TABLE PolicyRecord ADD COLUMN hideSystemBars INTEGER NOT NULL DEFAULT 0"
            )
            db.execSQL(
                "ALTER TABLE PolicyRecord ADD COLUMN appliedHideSystemBars INTEGER NOT NULL DEFAULT 0"
            )
        }
    }
